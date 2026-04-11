import { Link } from "react-router";
import { optimizeCloudinaryImage } from "@/lib/cloudinary";
import { useAuthStore } from "@/store/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { logOut } from "@/api/auth/auth.api";
const organizerSession = [
  { name: "Profile", link: "/profile" },
  { name: "Dashboard", link: "/dashboard" },
];
const customerSession = [
  { name: "Profile", link: "/profile" },
  { name: "My Tickets", link: "/my-tickets" },
];
const onLogoutSession = [
  { name: "Login", link: "/login" },
  { name: "Register", link: "/register" },
];
const avatarFallback =
  "https://res.cloudinary.com/dhjorpzhh/image/upload/v1775836308/TwitterEgg_HP_iifytc.webp";
export default function Navbar() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const handleLogout = () => {
    try {
      clearSession();
      useAuthStore.persist.clearStorage();
      logOut();
    } catch (error) {
      console.error("failed to clear persisted session on logout", error);
    }
  };
  const avatarUrl = optimizeCloudinaryImage(user?.avatarUrl ?? avatarFallback);
  const menuItems = !user
    ? onLogoutSession
    : user.role === "ORGANIZER"
      ? organizerSession
      : customerSession;
  return (
    <section className="absolute flex items-center top-0 left-0 w-full max-h-25 lg:px-25 hover:bg-primary duration-400 transition-all group">
      <div className="flex w-full justify-between p-4 ">
        <Link
          to="/"
          className="text-primary group-hover:text-background font-bold duration-400 hover:scale-105 transition-all "
        >
          MATCHPASS
        </Link>
        <div className={!user ? "hidden" : "block"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="aspect-square w-10 overflow-hidden rounded-full"
                aria-label="Open user menu"
              >
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem disabled>
                    {user.firstName} {user.lastName}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              {!isHydrated ? (
                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
              ) : (
                menuItems.map(({ name, link }) => (
                  <DropdownMenuItem key={link} asChild>
                    <Link to={link}>{name}</Link>
                  </DropdownMenuItem>
                ))
              )}
              {user ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" onClick={handleLogout}>
                      Logout
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className={user ? "hidden" : "flex gap-2"}>
          {!isHydrated ? (
            <p>Loading...</p>
          ) : (
            onLogoutSession.map(({ name, link }) => (
              <Button
                key={link}
                className="px-3 group-hover:bg-white group-hover:text-primary duration-400 transition-all hover:scale-110 hover:font-semibold"
              >
                <Link to={link}>{name}</Link>
              </Button>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
