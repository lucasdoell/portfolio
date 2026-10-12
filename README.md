# Lucas's Portfolio Website

## Introduction

This is the source code for my personal portfolio website. It's built with Astro and Tailwind CSS. The night-mode hero sky is a WebGPU shader written with vgpu (`src/lib/night-sky.ts`), with a static image fallback.

## Features

- **Static Site Generation**: Utilizes Astro for optimal performance and SEO.
- **Night sky**: A pixel-art WebGPU shader behind the hero in night mode, loaded only when night is shown.
- **Writing**: A Markdown collection in `src/content/writing`, with an RSS feed. It renders an empty state until the first post.
- **Responsive Design**: Fully responsive interface using Tailwind CSS.
- **Portfolio Showcase**: Sections for projects, skills, and professional experience.

## Tech Stack

- **Static Site Generator**: Astro
- **Graphics**: vgpu (WebGPU)
- **CSS Framework**: Tailwind CSS

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- pnpm

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/lucasdoell/portfolio.git
   ```
2. Install the dependencies:
   ```sh
   pnpm install
   ```
3. Start the development server:
   ```sh
   pnpm dev
   ```
4. Open `http://localhost:4321` to view it in the browser.

## Acknowledgements

- [Astro](https://astro.build/)
- [vgpu](https://www.npmjs.com/package/vgpu)
- [Tailwind CSS](https://tailwindcss.com/)
