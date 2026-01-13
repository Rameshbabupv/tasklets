interface Product {
    id: number;
    name: string;
    code: string;
    description: string | null;
    defaultImplementorId: number | null;
    defaultDeveloperId: number | null;
    defaultTesterId: number | null;
}
interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
    onSave: () => void;
}
export default function ProductModal({ product, onClose, onSave }: ProductModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductModal.d.ts.map