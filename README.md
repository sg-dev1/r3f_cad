This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Visual Studio Code Extensions

- Auto Rename Tag
- Highlight Matching Tag
- Prettier - Code formatter
  (Search on the Settings (File/Preferences/Settings) screen for this items and check/select them)
  - format on save
  - format on paste
  - Default Formatter (Prettier - Code formatter)
  - prettier.singleQuote to true // use sinqle quotes for strings
  - prettier.semi to true // add semi colon at end of each line
  - Wrap Line Length to 120 // maximum amount of characters per line (it is in Extensions/HTML)
    // default was 80 which is a bit few
  - Prettier: Print Width set to 120
    // default was also 80 causing similar behaviour like Wrap Line Length
- styled-colors: Very handy to visualize CSS colors in JavaScript and TypeScript files

Other Extensions:

- Emmet (by default in vs code)
  - emmet.includeLanguages --> "javacript": "javascriptreact"
- ES7 Snippets --> Install Extension ES7 +React/Redux/React-Native snippets
  - rafce (arrow func with export)
  - rfce (regular func with export)
  - same as the file name
  - react auto import
    - uncheck the following
  - React Snippets > Settings: Import React On Top
    (then the import React from 'react' is not added to the top)
