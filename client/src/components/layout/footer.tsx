import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <span>Desenvolvido por</span>
          <span className="font-semibold text-primary">Dymas Gomes</span>
          <Heart className="w-4 h-4 text-red-500 fill-current" />
        </div>
      </div>
    </footer>
  );
}