import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { STORE_LIST, formatStoreNumber } from '@shared/stores';
import { Search } from 'lucide-react';

interface StoreSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export default function StoreSelector({ value, onValueChange, required, placeholder = "Selecione uma loja" }: StoreSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter stores based on search term
  const filteredStores = useMemo(() => {
    if (!searchTerm) {
      return STORE_LIST.slice(0, 100); // Show first 100 stores if no search
    }
    
    return STORE_LIST.filter(store => 
      store.toString().includes(searchTerm)
    ).slice(0, 50); // Limit to 50 results for performance
  }, [searchTerm]);

  const selectedStore = value ? STORE_LIST.find(store => store.toString() === value) : null;

  return (
    <div className="space-y-2">
      <Select 
        value={value} 
        onValueChange={onValueChange} 
        required={required}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedStore ? formatStoreNumber(selectedStore) : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="sticky top-0 bg-white border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar loja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus={isOpen}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredStores.length > 0 ? (
              filteredStores.map((storeNumber) => (
                <SelectItem key={storeNumber} value={storeNumber.toString()}>
                  {formatStoreNumber(storeNumber)}
                </SelectItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma loja encontrada
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
      
      {searchTerm && filteredStores.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Digite o número da loja para buscar
        </p>
      )}
    </div>
  );
}