import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const Icons = {
  // Navigation Icons
  home: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
    </svg>
  ),
  homeActive: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  requests: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  requestsActive: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
  calls: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  ),
  callsActive: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  
  // Action Icons
  menu: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  ),
  close: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
  search: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  ),
  add: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  send: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  ),
  
  // Call Icons
  phone: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  ),
  video: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  ),
  endCall: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.18-.29-.43-.29-.71 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.66c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.73-1.68-1.36-2.66-1.85-.33-.16-.56-.51-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
    </svg>
  ),
  mute: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
    </svg>
  ),
  unmute: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  ),
  videoOff: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27l1.09 1.09C3.04 4.54 3 4.76 3 5v12c0 .55.45 1 1 1h12.73l3 3 1.27-1.27L3.27 2zM5 16V6.27L14.73 16H5z" />
    </svg>
  ),
  
  // Utility Icons
  clear: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
  logout: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
    </svg>
  ),
  edit: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  ),
  back: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  check: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  ),
  callIncoming: ({ className = "w-4 h-4", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41z" />
    </svg>
  ),
  callOutgoing: ({ className = "w-4 h-4", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z" />
    </svg>
  ),
  callMissed: ({ className = "w-4 h-4", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M19.59 7L12 14.59 6.41 9H11V7H3v8h2v-4.59l7 7 9-9z" />
    </svg>
  ),
  user: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  ),
  trash: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  ),
  switchAccount: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  ),
  info: ({ className = "w-6 h-6", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  ),
  checkDouble: ({ className = "w-4 h-4", size, ...props }: IconProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" {...props}>
      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
    </svg>
  )
};
