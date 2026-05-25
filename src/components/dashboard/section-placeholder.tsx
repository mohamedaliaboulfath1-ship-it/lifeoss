import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionPlaceholderProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export function SectionPlaceholder({
  icon,
  title,
  description,
  features,
}: SectionPlaceholderProps) {
  return (
    <div className="animate-fade-up space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text2 text-sm mb-4">{description}</p>
          <ul className="space-y-2 text-text3 text-sm">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-gold">✦</span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-text3 font-mono border-r-2 border-gold pr-3">
            البيانات محفوظة في Supabase — استخدم استيراد JSON من النسخة HTML
            لنقل بياناتك.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
