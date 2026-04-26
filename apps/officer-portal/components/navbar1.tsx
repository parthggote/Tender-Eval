import { Menu, ArrowRight } from 'lucide-react';
import * as React from 'react';
import Link from 'next/link';
import { AppLogo } from '~/components/ui/app-logo';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@workspace/ui/components/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@workspace/ui/components/sheet';
import { ThemeToggle } from '@workspace/ui/components/theme-toggle';

interface MenuItem {
  title: string;
  url: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
}

interface Navbar1Props {
  logo?: { url: string; title: string };
  menu?: MenuItem[];
  mobileExtraLinks?: { name: string; url: string }[];
  auth?: {
    login: { text: string; url: string };
    signup: { text: string; url: string };
  };
}

const Navbar1 = ({
  logo = { url: '/', title: 'TenderEval' },
  menu = [],
  mobileExtraLinks = [],
  auth = {
    login: { text: 'Sign in', url: '/auth/sign-in' },
    signup: { text: 'Get started', url: '/auth/sign-in' },
  },
}: Navbar1Props) => {
  return (
    <header className="py-3 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6">
        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={logo.url} className="flex items-center gap-2.5">
              <AppLogo size={36} showName useSketchFont nameClassName="text-lg" />
            </Link>

            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {menu.map((item) => renderMenuItem(item))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="font-accent tracking-wide">
              <Link href={auth.login.url}>{auth.login.text.toUpperCase()}</Link>
            </Button>
            <Button asChild size="sm" className="rounded-none font-accent tracking-wide gap-1.5">
              <Link href={auth.signup.url}>
                {auth.signup.text.toUpperCase()}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="flex lg:hidden items-center justify-between">
          <Link href={logo.url} className="flex items-center gap-2">
            <AppLogo size={32} showName useSketchFont nameClassName="text-base" />
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu">
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto" side="right">
              <SheetHeader>
                <SheetTitle>
                  <Link href={logo.url} className="flex items-center gap-2">
                    <AppLogo size={32} showName useSketchFont nameClassName="text-base" />
                  </Link>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                <Accordion type="single" collapsible className="flex w-full flex-col gap-2">
                  {menu.map((item) => renderMobileMenuItem(item))}
                </Accordion>

                {mobileExtraLinks.length > 0 && (
                  <div className="border-t border-border pt-4 grid grid-cols-2 gap-1">
                    {mobileExtraLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.url}
                        className="inline-flex h-9 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <Button asChild variant="outline" className="rounded-none font-accent tracking-wide">
                    <Link href={auth.login.url}>{auth.login.text.toUpperCase()}</Link>
                  </Button>
                  <Button asChild className="rounded-none font-accent tracking-wide gap-1.5">
                    <Link href={auth.signup.url}>
                      {auth.signup.text.toUpperCase()}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

const renderMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger className="text-sm font-accent font-medium tracking-wide gap-1.5">
          {item.icon && <span className="opacity-70">{item.icon}</span>}
          {item.title.toUpperCase()}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-72 p-2">
            {item.items.map((subItem) => (
              <li key={subItem.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={subItem.url}
                    className="flex gap-3 rounded-md p-3 hover:bg-muted transition-colors group"
                  >
                    {subItem.icon && (
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center border border-border shrink-0">
                        {subItem.icon}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{subItem.title}</p>
                      {subItem.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {subItem.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem key={item.title}>
      <Link
        href={item.url}
        className="inline-flex h-9 items-center gap-1.5 px-4 text-sm font-accent font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted tracking-wide"
      >
        {item.icon && <span className="opacity-70">{item.icon}</span>}
        {item.title.toUpperCase()}
      </Link>
    </NavigationMenuItem>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title} className="border-b-0">
        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="pl-4 border-l border-border ml-2 space-y-1">
          {item.items.map((subItem) => (
            <Link
              key={subItem.title}
              href={subItem.url}
              className="flex gap-3 rounded-md p-2 hover:bg-muted transition-colors"
            >
              {subItem.icon && <div className="text-muted-foreground mt-0.5">{subItem.icon}</div>}
              <div>
                <p className="text-sm font-medium">{subItem.title}</p>
                {subItem.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{subItem.description}</p>
                )}
              </div>
            </Link>
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      key={item.title}
      href={item.url}
      className="text-sm font-medium py-2 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {item.title}
    </Link>
  );
};

export { Navbar1 };

