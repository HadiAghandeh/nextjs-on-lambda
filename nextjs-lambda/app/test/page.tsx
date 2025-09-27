
import ServerPerformanceTest from '@/components/ServerPerformanceTest';

export const dynamic = 'force-dynamic'; 

export default async function Page() {
 
  return (
    <ul>
      <ServerPerformanceTest></ServerPerformanceTest>
    </ul>
  )
}