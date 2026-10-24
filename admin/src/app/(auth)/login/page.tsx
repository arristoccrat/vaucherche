import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vaucherche Admin</CardTitle>
          <CardDescription>
            Ще ви изпратим линк за вход по имейл.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams.error ? (
            <p className="text-sm text-destructive">
              Линкът е невалиден или е изтекъл. Поискайте нов.
            </p>
          ) : null}
          <LoginForm next={searchParams.next} />
        </CardContent>
      </Card>
    </main>
  );
}
