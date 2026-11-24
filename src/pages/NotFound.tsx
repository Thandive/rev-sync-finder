import { Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";

const NotFound = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <AppNav />
    <main className="flex-1 flex items-center justify-center px-5">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-label mb-3">// 404</div>
        <h1 className="text-2xl font-semibold mb-6">This page does not exist.</h1>
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-primary border-b border-primary/40 hover:border-primary pb-1">
          Back to Rev-Sync →
        </Link>
      </div>
    </main>
  </div>
);

export default NotFound;
