import ActiveStatus from "./components/ActiveStatus";
import { Providers } from "./components/theme/Providers";
import AuthContext from "./context/AuthContext";
import ToasterContext from "./context/ToasterContext";
import CommandPalette from "./components/CommandPalette";
import "./globals.css";

export const metadata = {
  title: "ConvoX - Realtime Messaging",
  description: "Next-Gen Realtime Messenger with Voice Notes, Rich Previews, and Reactions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthContext>
          <Providers>
            <>
              <ActiveStatus />
              <ToasterContext />
              <CommandPalette />
              {children}
            </>
          </Providers>
        </AuthContext>
      </body>
    </html>
  );
}
