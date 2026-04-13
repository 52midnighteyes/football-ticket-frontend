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
    <section className="group absolute top-0 left-0 z-10 flex max-h-20 w-full items-center bg-primary transition-all duration-300 lg:bg-transparent lg:hover:bg-primary">
      <div className="flex w-full justify-between p-4 lg:px-25 items-center">
        <Link
          to="/"
          className="font-bold h-fit text-background transition-all duration-300 lg:text-primary lg:group-hover:text-background lg:hover:scale-105"
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
                  className="h-10 w-10 object-cover object-center"
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
            <p className="text-background lg:text-foreground lg:group-hover:text-background">
              Loading...
            </p>
          ) : (
            onLogoutSession.map(({ name, link }) => (
              <Button
                key={link}
                className="px-2 font-semibold lg:px-5 text-sm transition-all duration-300 lg:group-hover:bg-white lg:group-hover:text-primary lg:hover:scale-110 lg:hover:font-semibold"
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
