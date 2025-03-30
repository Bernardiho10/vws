# Vote With Sense Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## New Features

### User Authentication

- Users can now create accounts and log in using the `LoginForm` and `RegistrationForm` components.
- Authentication state is managed using the `AuthProvider` context.
- Protected routes ensure that only authenticated users can access certain parts of the application.

### Feedback System

- Users can submit feedback using the `FeedbackForm` component.
- Feedback is sent to the `/api/feedback` endpoint for processing.

### Image Editing Tools

- Users can apply filters (grayscale, sepia) and crop images using the `ImageEditor` component.
- Image editing utilities are implemented in `image-editing-utils.ts`.

## Testing

### Authentication Testing

- Test account creation and login functionality.
- Verify that protected routes are only accessible to authenticated users.

### Feedback System Testing

- Ensure feedback is submitted correctly and processed by the API endpoint.

### Image Editing Testing

- Verify that users can apply filters (grayscale, sepia) and crop images successfully.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Download face-api.js models:
   - Create a `public/models` directory
   - Download the following files from the face-api.js repository and place them in the `public/models` directory:
     - tiny_face_detector_model-weights_manifest.json
     - tiny_face_detector_model.weights.bin
     - face_landmark_68_model-weights_manifest.json
     - face_landmark_68_model.weights.bin
     - face_recognition_model-weights_manifest.json
     - face_recognition_model.weights.bin

   You can download these files from:
   https://github.com/justadudewhohacks/face-api.js/tree/master/weights

3. Configure your blockchain settings:
   - Update the `CONTRACT_ADDRESS` in `services/blockchain.ts` with your deployed contract address
   - Make sure you have MetaMask or another Web3 provider installed

4. Start the development server:
```bash
npm run dev
```

## Features

- Quadratic voting system
- Facial verification for voter identity
- Blockchain-based vote storage
- IPFS integration for storing verification images
- Real-time face detection

## Architecture

The application uses:
- Next.js for the frontend
- face-api.js for face detection
- IPFS for decentralized image storage
- Ethereum for vote and verification data storage
- Web3.js for blockchain interactions

## Security

- All facial verification data is stored on IPFS
- Verification metadata is stored on the blockchain
- Images are hashed before storage
- Face detection is performed client-side
- Quadratic voting prevents vote concentration
