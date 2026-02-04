"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
} from "react";

// shadcn
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// utils
import { cn } from "@/lib/utils";

// assets
import { ChevronDown, CheckIcon, Globe } from "lucide-react";
import { CircleFlag } from "react-circle-flags";

// data
import { useCountry } from "~/lib/hooks/useCountry";
import { LOCALE_OPTIONS, type LocaleOption } from "~/lib/locale/locales";

// Dropdown props
interface CountryDropdownProps {
  options?: LocaleOption[];
  onChange?: (option: LocaleOption) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
  className?: string;
}

const CountrySelect = (
  {
    options = LOCALE_OPTIONS.filter((opt) => opt.id !== "global"),
    onChange,
    defaultValue,
    disabled = false,
    placeholder = "Select a country",
    slim = false,
    className,
    ...triggerProps
  }: CountryDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false);
  const { locale: globallySelectedLocale, setLocaleId: setGlobalLocaleId } =
    useCountry();
  const [selectedLocale, setSelectedLocale] = useState<
    LocaleOption | undefined
  >(() => globallySelectedLocale ?? undefined);
  const filteredOptions = useMemo(() => options, [options]);

  useEffect(() => {
    if (defaultValue) {
      const initialLocale = filteredOptions.find(
        (option) => option.id === defaultValue,
      );
      if (initialLocale) {
        setSelectedLocale(initialLocale);
      } else {
        setSelectedLocale(undefined);
      }
    } else if (globallySelectedLocale) {
      setSelectedLocale(globallySelectedLocale);
    } else {
      setSelectedLocale(undefined);
    }
  }, [defaultValue, filteredOptions, globallySelectedLocale]);

  const handleSelect = useCallback(
    (option: LocaleOption) => {
      setSelectedLocale(option);
      setGlobalLocaleId(option.id);
      onChange?.(option);
      setOpen(false);
    },
    [onChange, setGlobalLocaleId],
  );

  const triggerClasses = cn(
    "flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    slim ? "w-12 px-2" : "w-full px-3",
    className,
  );

  const selectedContentClasses = cn(
    "flex items-center gap-2 overflow-hidden",
    slim ? "w-auto" : "w-0 flex-grow",
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={triggerClasses}
        disabled={disabled}
        {...triggerProps}
      >
        {selectedLocale ? (
          <div className={selectedContentClasses}>
            <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <CircleFlag
                countryCode={getFlagCode(selectedLocale)}
                height={20}
              />
            </div>
            {slim === false && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedLocale.label}
              </span>
            )}
          </div>
        ) : (
          <span>{slim === false ? placeholder : <Globe size={20} />}</span>
        )}
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="max-h-[200px] w-full sm:max-h-[270px]">
          <CommandList>
            <div className="bg-popover sticky top-0 z-10">
              <CommandInput placeholder="Search country..." />
            </div>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  className="flex w-full items-center gap-2"
                  key={option.id}
                  onSelect={() => handleSelect(option)}
                >
                  <div className="flex w-0 flex-grow space-x-2 overflow-hidden">
                    <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <CircleFlag
                        countryCode={getFlagCode(option)}
                        height={20}
                      />
                    </div>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {option.label}
                    </span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      option.id === selectedLocale?.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

CountrySelect.displayName = "CountrySelect";

export const CountryDropdown = forwardRef(CountrySelect);

function getFlagCode(option: LocaleOption): string {
  if (option.id === "eu") return "eu";
  if (option.countryCode) return option.countryCode.toLowerCase();
  if (option.affiliateCountryCode)
    return option.affiliateCountryCode.toLowerCase();
  return "us";
}
