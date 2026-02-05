"use client";

import { CONTACT_OPTIONS, type ContactOption } from "../contact-options";

export default function ContactClient() {
  const handleOptionClick = (option: string) => {
    console.log(option);
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      {CONTACT_OPTIONS.map((option: ContactOption) => {
        const IconComponent = option.icon;
        return (
          <button
            key={option.value}
            className="hover:bg-muted relative flex min-h-36 flex-col items-start justify-start rounded-md border p-4 pr-24 text-left hover:cursor-pointer"
            onClick={() => handleOptionClick(option.value)}
          >
            <IconComponent
              strokeWidth={2}
              className="absolute top-2 right-2 size-12 opacity-20"
            />
            <h3 className="font-bold">{option.label}</h3>
            <p className="text-muted-foreground mt-auto text-sm">
              {option.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
