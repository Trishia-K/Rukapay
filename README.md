# RukaTrack

This is an app that automates Sign-in/sign-out logging, meeting scheduling and has printable meeting
attendance sheets so as to replace the book attendance and daily meeting paper attendance.

## What's in here

```
rukatrack/
  backend/    NestJS + Prisma + PostgreSQL - the API and database
  frontend/   React + Vite - dashboard, kiosk, meetings, team, reports
```

## What each part does

- **Dashboard** - today's numbers at a glance (signed in, currently in
  the building, on leave/remote).
- **Sign-In / Sign-Out Log** - A list of who has signed in and out. 
  meeting attendance.
- **Kiosk** - Screen to search name and sign in
- **Meetings** - schedule a meeting. The moment it's created, the
  attendance sheet is pre-filled with everyone expected and signatures are added as people arrive.
- **Meeting room** - Print attendance sheet is found here
- **Team** - Add staff, mark someone on
  leave or working remotely for a date range, and see each person's
  attendance % and how many times they've signed out before 5pm.
- **Reports** - download a spreadsheet for any month attendance.

