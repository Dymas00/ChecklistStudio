// Lista de lojas disponíveis no sistema
// Extraída do arquivo Excel fornecido pelo usuário em 15/08/2025

export const STORE_LIST = [
  2090, 2163, 2377, 2380, 2381, 2382, 2386, 2388, 2390, 2391, 3337, 3525, 3540, 3546, 
  3564, 3569, 3580, 3583, 3588, 3592, 3593, 3617, 3619, 3677, 3679, 3684, 3685, 3697, 
  3698, 3703, 3707, 3719, 3740, 3798, 3810, 3817, 3818, 3831, 3844, 3850, 3851, 3858, 
  3869, 3878, 3879, 3880, 3881, 3887, 3890, 3896, 3906, 3908, 3910, 3912, 3917, 3920, 
  3924, 3925, 3930, 3934, 3936, 3939, 3941, 3943, 3951, 3953, 3954, 3955, 3956, 3957, 
  3958, 3961, 3962, 3966, 3967, 3968, 3969, 3970, 3971, 3972, 3973, 3974, 3975, 3976, 
  3977, 3978, 3979, 3980, 3981, 3982, 3983, 3984, 3985, 3986, 3987, 3988, 3989, 3990, 
  3991, 3992, 3993, 3994, 3995, 3996, 3997, 3998, 3999, 4000, 4001, 4002, 4003, 4004, 
  4005, 4006, 4007, 4008, 4009, 4010, 4011, 4012, 4013, 4014, 4015, 4016, 4017, 4018, 
  4019, 4020, 4021, 4022, 4023, 4024, 4025, 4026, 4027, 4028, 4029, 4030, 4031, 4032
];

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