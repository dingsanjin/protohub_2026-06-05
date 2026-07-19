import * as React from 'react';

export const navigateRef = React.createRef<{ navigate: (to: string) => void }>();

export function setNavigate(navigate: (to: string) => void) {
  navigateRef.current = { navigate };
}

export function redirectTo(to: string) {
  if (navigateRef.current) {
    navigateRef.current.navigate(to);
  } else {
    window.location.href = to;
  }
}