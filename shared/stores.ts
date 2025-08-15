// Lista de lojas disponíveis no sistema
// Extraída do arquivo Excel fornecido pelo usuário em 15/08/2025

// Importar a lista completa do arquivo JSON
import storeListJson from '../lojas_lista.json';

export const STORE_LIST = storeListJson;

// Função para buscar lojas por número
export function searchStores(searchTerm: string): number[] {
  if (!searchTerm) return STORE_LIST.slice(0, 50);
  
  const term = searchTerm.toLowerCase();
  return STORE_LIST.filter(store => 
    store.toString().includes(term)
  ).slice(0, 100);
}

// Função para formatar número da loja  
export function formatStoreNumber(storeNumber: number | string): string {
  return `Loja ${storeNumber}`;
}

// Função para validar se uma loja existe
export function isValidStore(storeNumber: number | string): boolean {
  const num = typeof storeNumber === 'string' ? parseInt(storeNumber) : storeNumber;
  return STORE_LIST.includes(num);
}