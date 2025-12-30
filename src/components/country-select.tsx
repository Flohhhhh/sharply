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
import { countries } from "country-data-list";

// Country type
import { useCountry } from "~/lib/hooks/useCountry";
import { type Country } from "~/types/country";

// Dropdown props
interface CountryDropdownProps {
  options?: Country[];
  onChange?: (country: Country) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  slim?: boolean;
  className?: string;
}

const forcedCountryOrder = ["US", "EU", "GB"];

const CountrySelect = (
  {
    options = countries.all.filter(
      (country: Country) =>
        country.emoji && country.status !== "deleted" && country.ioc !== "PRK",
    ),
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
  const { country: globallySelectedCountry, setCountry: setGlobalCountry } =
    useCountry();
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(
    () => globallySelectedCountry ?? undefined,
  );
  const filteredOptions = useMemo(
    () =>
      forcedCountryOrder
        .map((alpha2) => options.find((country) => country.alpha2 === alpha2))
        .filter((country): country is Country => country !== undefined),
    [options],
  );

  useEffect(() => {
    if (defaultValue) {
      const initialCountry = filteredOptions.find(
        (country) => country.alpha3 === defaultValue,
      );
      if (initialCountry) {
        setSelectedCountry(initialCountry);
      } else {
        // Reset selected country if defaultValue is not found
        setSelectedCountry(undefined);
      }
    } else if (globallySelectedCountry) {
      setSelectedCountry(globallySelectedCountry);
    } else {
      // Reset selected country if defaultValue is undefined or null
      setSelectedCountry(undefined);
    }
  }, [defaultValue, filteredOptions, globallySelectedCountry]);

  const handleSelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setGlobalCountry(country);
      onChange?.(country);
      setOpen(false);
    },
    [onChange, setGlobalCountry],
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
        {selectedCountry ? (
          <div className={selectedContentClasses}>
            <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <CircleFlag
                countryCode={selectedCountry.alpha2.toLowerCase()}
                height={20}
              />
            </div>
            {slim === false && (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {selectedCountry.name}
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
              {filteredOptions.map((option, key: number) => (
                <CommandItem
                  className="flex w-full items-center gap-2"
                  key={key}
                  onSelect={() => handleSelect(option)}
                >
                  <div className="flex w-0 flex-grow space-x-2 overflow-hidden">
                    <div className="inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                      <CircleFlag
                        countryCode={option.alpha2.toLowerCase()}
                        height={20}
                      />
                    </div>
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {option.name}
                    </span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      option.name === selectedCountry?.name
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
