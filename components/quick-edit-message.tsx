'use client';

import { useState, useRef, useEffect } from 'react';
import { Percent, Calendar, CreditCard, Save, X, Sparkles } from 'lucide-react';

interface QuickEditMessageProps {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

export default function QuickEditMessage({ content, onSave, onCancel }: QuickEditMessageProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [showActions, setShowActions] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus and highlight content when component mounts
    if (contentRef.current) {
      contentRef.current.focus();
      highlightEditableParts();
    }
  }, []);

  const highlightEditableParts = () => {
    if (!contentRef.current) return;
    
    let html = contentRef.current.innerHTML;
    
    // First, protect dates from being treated as prices
    // Mark dates temporarily to avoid them being matched as prices
    html = html.replace(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:-\d{1,2})?,?\s*\d{4}\b/gi,
      '{{DATE:$&}}'
    );
    html = html.replace(
      /\b\d{4}-\d{2}-\d{2}\b/g,
      '{{DATE:$&}}'
    );
    html = html.replace(
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      '{{DATE:$&}}'
    );
    
    // Protect quantities with units (e.g., "4 people", "5 items", "3 units")
    html = html.replace(
      /\b\d+\s+(?:people|persons?|guests?|items?|units?|pieces?|boxes?|packages?|days?|nights?|hours?|minutes?|pax|rooms?|beds?|adults?|children|kids?|passengers?|tickets?|seats?|tables?|participants?|attendees?|employees?|staff|members?|users?|accounts?|licenses?)\b/gi,
      '{{QUANTITY:$&}}'
    );
    
    // Also protect standalone numbers in date contexts (e.g., "June 16", "room 18")
    html = html.replace(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/gi,
      '{{DATE_NUM:$&}}'
    );
    html = html.replace(
      /\b(?:room|floor|suite|apartment|unit|building|level|section|zone|area|block|lot)\s*#?\s*(\d+)\b/gi,
      '{{LOCATION:$&}}'
    );
    
    // Highlight prices - must have currency symbol or be followed by currency code
    // More specific patterns for prices
    html = html.replace(
      /(\$|€|£|¥)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
      '<span class="editable-price" contenteditable="true">$&</span>'
    );
    html = html.replace(
      /\b(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|CAD|AUD)\b/g,
      '<span class="editable-price" contenteditable="true">$&</span>'
    );
    
    // Also match prices with context words
    html = html.replace(
      /\b(?:price|cost|fee|total|subtotal|amount|charge)(?:\s+is|\s+of|:)?\s*(\$|€|£|¥)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
      function(match) {
        if (!match.includes('editable-price')) {
          return '<span class="editable-price" contenteditable="true">' + match + '</span>';
        }
        return match;
      }
    );
    
    // Now restore protected dates and quantities
    html = html.replace(/{{DATE:([^}]+)}}/g, '<span class="editable-date" contenteditable="true">$1</span>');
    html = html.replace(/{{DATE_NUM:([^}]+)}}/g, '$1'); // Don't highlight standalone date numbers
    html = html.replace(/{{LOCATION:([^}]+)}}/g, '$1'); // Don't highlight location numbers
    html = html.replace(/{{QUANTITY:([^}]+)}}/g, '$1'); // Don't make quantities editable
    
    // Highlight delivery/lead times (e.g., 3-5 days, 2 weeks)
    html = html.replace(
      /\b(\d+(?:-\d+)?)\s*(business\s+days?|weeks?|months?)\b/gi,
      '<span class="editable-time" contenteditable="true">$&</span>'
    );
    
    // Highlight percentages (e.g., 10%, 5.5%)
    html = html.replace(
      /(\d+(?:\.\d+)?)\s*%/g,
      '<span class="editable-percentage" contenteditable="true">$&</span>'
    );
    
    contentRef.current.innerHTML = html;
  };

  const handleContentChange = () => {
    if (contentRef.current) {
      // Remove HTML tags but keep the text
      const text = contentRef.current.innerText;
      setEditedContent(text);
    }
  };

  const applyDiscount = (percentage: number) => {
    if (!contentRef.current) return;
    
    const priceElements = contentRef.current.querySelectorAll('.editable-price');
    priceElements.forEach((elem) => {
      const text = elem.textContent || '';
      // Look for currency symbols or currency codes to ensure it's a price
      const currencyMatch = text.match(/(\$|€|£|¥)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      const codeMatch = text.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(USD|EUR|GBP|JPY|CAD|AUD)/);
      const contextMatch = text.match(/(?:price|cost|fee|total|subtotal|amount|charge).*?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      
      let match = null;
      let numberToReplace = null;
      
      if (currencyMatch) {
        numberToReplace = currencyMatch[2];
      } else if (codeMatch) {
        numberToReplace = codeMatch[1];
      } else if (contextMatch) {
        numberToReplace = contextMatch[1];
      }
      
      if (numberToReplace) {
        const value = parseFloat(numberToReplace.replace(/,/g, ''));
        const discounted = value * (1 - percentage / 100);
        const formattedPrice = discounted.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        elem.textContent = text.replace(numberToReplace, formattedPrice);
        elem.classList.add('highlight-change');
        
        // Remove and re-add the class to restart animation
        setTimeout(() => {
          elem.classList.remove('highlight-change');
          setTimeout(() => elem.classList.add('highlight-change'), 10);
        }, 10);
      }
    });
    handleContentChange();
  };

  const extendDeliveryTime = (days: number) => {
    if (!contentRef.current) return;
    
    const timeElements = contentRef.current.querySelectorAll('.editable-time');
    timeElements.forEach((elem) => {
      const text = elem.textContent || '';
      const match = text.match(/(\d+)(?:-(\d+))?\s*(days?|weeks?|business days)/i);
      if (match) {
        const originalDays = parseInt(match[1]);
        const originalEndDays = match[2] ? parseInt(match[2]) : originalDays;
        const newDays = originalDays + days;
        const newEndDays = originalEndDays + days;
        const newText = match[2] 
          ? `${newDays}-${newEndDays} ${match[3]}`
          : `${newDays} ${match[3]}`;
        elem.textContent = newText;
        elem.classList.add('highlight-change');
      }
    });
    handleContentChange();
  };

  const addPaymentTerms = () => {
    if (!contentRef.current) return;
    
    const paymentTermsText = '\n\nPayment Terms:\n- 50% deposit upon order confirmation\n- 50% balance due before shipment\n- Accepted payment methods: Wire transfer, Credit card\n- All prices are subject to applicable taxes';
    
    contentRef.current.innerText += paymentTermsText;
    handleContentChange();
    
    // Re-highlight after adding new content
    setTimeout(highlightEditableParts, 100);
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions Bar */}
      {showActions && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <button
            onClick={() => applyDiscount(10)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Percent className="w-4 h-4 mr-1.5 text-gray-600" />
            Apply 10% Discount
          </button>
          <button
            onClick={() => applyDiscount(5)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Percent className="w-4 h-4 mr-1.5 text-gray-600" />
            Apply 5% Discount
          </button>
          <button
            onClick={() => extendDeliveryTime(7)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4 mr-1.5 text-gray-600" />
            +7 Days Delivery
          </button>
          <button
            onClick={() => extendDeliveryTime(14)}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4 mr-1.5 text-gray-600" />
            +14 Days Delivery
          </button>
          <button
            onClick={addPaymentTerms}
            className="flex items-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <CreditCard className="w-4 h-4 mr-1.5 text-gray-600" />
            Add Payment Terms
          </button>
        </div>
      )}

      {/* Editable Content */}
      <div className="relative">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          className="w-full p-4 border-2 border-blue-300 rounded-lg bg-white min-h-[200px] focus:outline-none focus:border-blue-500 quick-edit-content"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {content}
        </div>
        
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white rounded-md shadow-sm border border-gray-200 p-1">
          <button
            onClick={handleSave}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Save changes"
          >
            <Save className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Cancel editing"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg text-sm">
        <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-blue-800">
          <p className="font-medium mb-1">Quick Edit Mode Active</p>
          <p className="mb-2">Click directly on highlighted items to edit them. Use the quick action buttons for common modifications.</p>
          <div className="text-xs space-y-1">
            <p>• <span className="inline-block px-1 bg-yellow-200 rounded">Yellow</span> = Prices (with currency symbols or context)</p>
            <p>• <span className="inline-block px-1 bg-blue-200 rounded">Blue</span> = Dates</p>
            <p>• <span className="inline-block px-1 bg-green-200 rounded">Green</span> = Delivery times</p>
            <p>• <span className="inline-block px-1 bg-pink-200 rounded">Pink</span> = Percentages</p>
          </div>
        </div>
      </div>

    </div>
  );
}