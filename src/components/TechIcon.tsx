import {
  siApachekafka, siC, siClerk, siCodechef, siCodeforces, siDocker, siExpress, siFastapi, siFlask, siFlutter, siGit, siGreensock,
  siJavascript, siJsonwebtokens, siLeetcode, siLinux, siMongodb, siMysql, siNextdotjs, siOpenjdk, siOpentelemetry, siOracle,
  siPostgresql, siPython, siRazorpay, siReact, siRedis, siScikitlearn, siSolidity, siSpringboot, siTailwindcss, siThreedotjs,
  siTypescript, siVuedotjs, siGeeksforgeeks, siHackerrank, siGooglegemini, siLatex, siSupabase, siSqlalchemy, type SimpleIcon,
} from 'simple-icons'
import { Binary, Boxes, Cloud, Cpu, Database, Network, Sigma, Workflow } from 'lucide-react'

const ICONS: Record<string, SimpleIcon> = {
  Python: siPython, Java: siOpenjdk, C: siC, JavaScript: siJavascript, TypeScript: siTypescript, SQL: siMysql,
  React: siReact, 'Next.js': siNextdotjs, Tailwind: siTailwindcss, 'Vue.js': siVuedotjs,
  FastAPI: siFastapi, Express: siExpress, Flask: siFlask, 'Spring Boot': siSpringboot,
  PostgreSQL: siPostgresql, MongoDB: siMongodb, MySQL: siMysql, Oracle: siOracle,
  Redis: siRedis, Kafka: siApachekafka, Docker: siDocker, Git: siGit, Linux: siLinux, OpenTelemetry: siOpentelemetry,
  Clerk: siClerk, Razorpay: siRazorpay, JWT: siJsonwebtokens, Solidity: siSolidity, Flutter: siFlutter,
  'Three.js': siThreedotjs, GSAP: siGreensock, 'scikit-learn': siScikitlearn,
  LeetCode: siLeetcode, Codeforces: siCodeforces, CodeChef: siCodechef, GeeksforGeeks: siGeeksforgeeks, HackerRank: siHackerrank,
  Gemini: siGooglegemini, LaTeX: siLatex, Supabase: siSupabase, SQLAlchemy: siSqlalchemy,
}
const CONCEPTS: Record<string, typeof Binary> = { DSA: Binary, OOP: Boxes, DBMS: Database, OS: Cpu, Networks: Network, FedAvg: Workflow, 'Azure Blob': Cloud, Groq: Sigma, Qdrant: Database }

/* Brand colours that would vanish on the current theme fall back to the text colour. */
const tooDark = (hex: string) => { const n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return .2126 * r + .7152 * g + .0722 * b < 60 }

export default function TechIcon({ name, size = 16, mono = false }: { name: string; size?: number; mono?: boolean }) {
  const icon = ICONS[name]
  if (icon) {
    const fill = mono || tooDark(icon.hex) ? 'currentColor' : `#${icon.hex}`
    return <svg className="tech-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} fill={fill} /></svg>
  }
  const Concept = CONCEPTS[name]
  if (Concept) return <Concept className="tech-icon" size={size} aria-hidden="true" />
  if (name === 'AtCoder') return <span className="tech-icon tech-letter" style={{ width: size, height: size, fontSize: size * .55 }}>AC</span>
  return <span className="tech-icon tech-letter" style={{ width: size, height: size, fontSize: size * .6 }}>{name[0]}</span>
}
