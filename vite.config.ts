import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import process from 'node:process'

const [githubOwner, githubRepository] = process.env.GITHUB_REPOSITORY?.split('/') ?? []
const githubProjectBase = process.env.GITHUB_ACTIONS === 'true'
  && githubRepository
  && githubOwner
  && githubRepository !== `${githubOwner}.github.io`
  ? `/${githubRepository}/`
  : '/'
const base = process.env.VITE_BASE_PATH?.trim() || githubProjectBase

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
})
