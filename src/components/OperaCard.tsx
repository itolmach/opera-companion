import Image from 'next/image';
import Link from 'next/link';
import { Opera } from '@/types';

interface OperaCardProps {
  opera: Opera;
}

export function OperaCard({ opera }: OperaCardProps) {
  return (
    <Link href={`/opera/${opera.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative h-48 w-full">
          <Image
            src={opera.imageUrl || '/images/placeholder.jpg'}
            alt={opera.title}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">{opera.title}</h3>
          <p className="text-sm text-gray-600">{opera.composer}</p>
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{opera.synopsis}</p>
        </div>
      </div>
    </Link>
  );
} 