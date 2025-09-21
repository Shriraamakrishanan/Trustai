
import React, { useState } from 'react';
import { EducationalItem } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface EducationalAccordionProps {
  items: EducationalItem[];
}

const AccordionItem: React.FC<{ item: EducationalItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-700">
      <h2>
        <button
          type="button"
          className="flex justify-between items-center w-full p-5 font-medium text-left text-slate-300 hover:bg-slate-700/50 transition duration-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{item.title}</span>
          <ChevronDownIcon className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} grid`}>
        <div className="overflow-hidden">
            <div className="p-5 border-t border-slate-700">
                <p className="mb-2 text-slate-400">{item.content}</p>
            </div>
        </div>
      </div>
    </div>
  );
};


const EducationalAccordion: React.FC<EducationalAccordionProps> = ({ items }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden">
      <h2 className="text-2xl font-bold text-center p-6 bg-slate-800 text-white">How to Spot Misinformation</h2>
      <div>
        {items.map((item, index) => (
          <AccordionItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default EducationalAccordion;
