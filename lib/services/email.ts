import nodemailer from 'nodemailer';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { getCompanySettings } from '../db/queries-supabase';

const COMPANY_ID = 1;

// Get email settings from database or fall back to env vars
export async function getEmailSettings() {
  const settings = await getCompanySettings(COMPANY_ID);
  
  if (settings?.email_user && settings?.email_password) {
    return {
      provider: settings.email_provider || 'gmail',
      imap: {
        user: settings.email_user,
        password: settings.email_password,
        host: settings.email_host || 'imap.gmail.com',
        port: settings.email_port || 993,
        tls: settings.email_secure !== false,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      },
      smtp: {
        host: settings.smtp_host || settings.email_host || 'smtp.gmail.com',
        port: settings.smtp_port || 587,
        secure: settings.smtp_port === 465,
        auth: {
          user: settings.smtp_user || settings.email_user,
          pass: settings.smtp_password || settings.email_password
        }
      },
      from: settings.email_from || settings.email_user
    };
  }
  
  // Fall back to environment variables
  return {
    provider: 'gmail',
    imap: {
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASS!,
      host: process.env.IMAP_HOST!,
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false }
    },
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!
      }
    },
    from: process.env.SMTP_USER!
  };
}

// Create SMTP transporter for sending emails
export const createTransporter = async () => {
  const settings = await getEmailSettings();
  return nodemailer.createTransport(settings.smtp);
};

// IMAP configuration for reading emails
export const getImapConfig = async () => {
  const settings = await getEmailSettings();
  return { imap: settings.imap };
};

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
}

export interface EmailMessage {
  uid: number;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
  attachments?: EmailAttachment[];
}

// Fetch unread emails from the last N days
export async function fetchUnreadEmails(daysBack: number = 7): Promise<EmailMessage[]> {
  const config = await getImapConfig();
  
  console.log('Connecting to IMAP server...');
  let connection;
  
  try {
    // Add timeout for connection
    connection = await Promise.race([
      imaps.connect(config),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('IMAP connection timeout')), 30000)
      )
    ]) as any;
    
    console.log('Connected to IMAP server');
    await connection.openBox('INBOX');
    
    // Calculate date N days ago
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysBack);
    const dateString = dateLimit.toISOString().split('T')[0];
    
    // Search for unread emails from the last week
    const searchCriteria = [
      'UNSEEN',
      ['SINCE', dateString]
    ];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: false,
      struct: true
    };
    
    console.log(`Searching for unread emails since ${dateString} (last ${daysBack} days)...`);
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} unread emails from the last ${daysBack} days`);
    const emails: EmailMessage[] = [];
    
    for (const item of messages) {
      const all = item.parts.find(part => part.which === '');
      if (!all?.body) continue;
      
      const parsed = await simpleParser(all.body);
      
      // Extract attachments
      const attachments: EmailAttachment[] = [];
      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const attachment of parsed.attachments) {
          attachments.push({
            filename: attachment.filename || 'unnamed',
            contentType: attachment.contentType || 'application/octet-stream',
            size: attachment.size || 0,
            content: attachment.content
          });
        }
      }
      
      emails.push({
        uid: item.attributes.uid,
        messageId: parsed.messageId || '',
        from: parsed.from?.value[0]?.address || '',
        to: parsed.to?.value[0]?.address || '',
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: parsed.html || undefined,
        date: parsed.date || new Date(),
        inReplyTo: parsed.inReplyTo || undefined,
        references: parsed.references ? Array.from(parsed.references) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });
    }
    
    await connection.closeBox();
    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        console.error('Error closing IMAP connection:', err);
      }
    }
  }
}

// Mark email as read
export async function markEmailAsRead(uid: number): Promise<void> {
  const config = await getImapConfig();
  const connection = await imaps.connect(config);
  
  try {
    await connection.openBox('INBOX');
    await connection.addFlags(uid, '\\Seen');
    await connection.closeBox();
  } finally {
    await connection.end();
  }
}

// Send email reply
export async function sendEmailReply(
  to: string,
  subject: string,
  content: string,
  inReplyTo?: string,
  references?: string[]
): Promise<void> {
  const transporter = await createTransporter();
  const settings = await getEmailSettings();
  
  const mailOptions = {
    from: settings.from,
    to,
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    text: content,
    html: content.replace(/\n/g, '<br>'),
    inReplyTo,
    references: references ? references.join(' ') : undefined,
    headers: {
      'In-Reply-To': inReplyTo,
      'References': references ? references.join(' ') : undefined
    }
  };
  
  await transporter.sendMail(mailOptions);
}

// Get email thread ID (uses Message-ID and References headers)
export function getThreadId(email: EmailMessage): string {
  // If this email has references, use the first reference as thread ID
  if (email.references && email.references.length > 0) {
    return email.references[0];
  }
  // If it's in reply to another email, use that as thread ID
  if (email.inReplyTo) {
    return email.inReplyTo;
  }
  // Otherwise, this is a new thread, use its own message ID
  return email.messageId;
}