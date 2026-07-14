"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-muted/40 overflow-x-auto px-4 py-4 font-mono text-sm leading-6">
      <code>{children}</code>
    </pre>
  );
}

export function RequestExampleTabs({
  curl,
  typescript,
}: {
  curl: string;
  typescript: string;
}) {
  const t = useTranslations("developerApi.docs");

  return (
    <Tabs defaultValue="curl" className="mt-4">
      <TabsList aria-label={t("exampleRequest")}>
        <TabsTrigger value="curl">{t("exampleCurl")}</TabsTrigger>
        <TabsTrigger value="typescript">{t("exampleTypeScript")}</TabsTrigger>
      </TabsList>
      <TabsContent value="curl">
        <CodeBlock>{curl}</CodeBlock>
      </TabsContent>
      <TabsContent value="typescript">
        <CodeBlock>{typescript}</CodeBlock>
      </TabsContent>
    </Tabs>
  );
}
