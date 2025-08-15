import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { STORE_LIST, formatStoreNumber } from '@shared/stores';
import { Search, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function StoreSelector({ value, onValueChange, required, placeholder = "Selecione uma loja" }: StoreSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter stores based on search term
  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) {
      return STORE_LIST.slice(0, 100); // Show first 100 stores if no search
    }
    
    const term = searchTerm.toLowerCase().trim();
    return STORE_LIST.filter(store => 
      store.toString().includes(term) || 
      formatStoreNumber(store).toLowerCase().includes(term)
    ).slice(0, 50); // Limit to 50 results for performance
  }, [searchTerm]);

  const selectedStore = value ? STORE_LIST.find(store => store.toString() === value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedStore ? formatStoreNumber(selectedStore) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b p-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar loja por número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none"
            />
          </div>
          <CommandEmpty>
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma loja encontrada.
              <br />
              <span className="text-xs">Digite o número da loja para buscar</span>
            </div>
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {filteredStores.map((storeNumber) => (
              <CommandItem
                key={storeNumber}
                value={storeNumber.toString()}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                  setSearchTerm('');
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === storeNumber.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                {formatStoreNumber(storeNumber)}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}