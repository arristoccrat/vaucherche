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
  searchParams: { next?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vaucherche Admin</CardTitle>
          <CardDescription>Влезте с имейл и парола.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={searchParams.next} />
        </CardContent>
      </Card>
    </main>
  );
}
