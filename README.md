# Song Lyrics Manager

A simple web application for managing song lyrics, built with Next.js and Vercel KV.

## Features

- Add, edit, and delete songs
- Reorder songs via drag and drop
- Hide/show songs
- Search functionality
- Adjustable font size
- Export songs to JSON
- Persistent storage using Vercel KV

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

The application uses:
- Next.js for the framework
- Vercel KV for data storage
- Tailwind CSS for styling
- TypeScript for type safety

## Deployment

The application is designed to be deployed on Vercel. Make sure to set up your Vercel KV database and configure the environment variables:

- `KV_URL`: Your Vercel KV database URL
- `KV_REST_API_URL`: Your Vercel KV REST API URL
- `KV_REST_API_TOKEN`: Your Vercel KV REST API token
- `KV_REST_API_READ_ONLY_TOKEN`: Your Vercel KV REST API read-only token

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
