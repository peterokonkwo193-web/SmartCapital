import { Link } from "react-router-dom";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/common/brand-mark";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <BrandLockup />
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CompassIcon className="size-7" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have been moved.
        </p>
      </div>
      <Button asChild>
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}

export default NotFoundPage;
