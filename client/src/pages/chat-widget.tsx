import { useParams } from "wouter";
import { WidgetPreview } from "@/components/WidgetPreview";

export default function ChatWidgetPage() {
  const { publicKey } = useParams();

  if (!publicKey) {
    return <div className="p-4 text-destructive">Invalid link</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <WidgetPreview publicKey={publicKey} />
      </div>
    </div>
  );
}
