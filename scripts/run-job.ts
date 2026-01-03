import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InsertRolePermissionJob } from '../src/jobs/insert-role-permission.job';

const jobMap: Record<string, () => Promise<void>> = {
  'insert-role-permission': async () => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const job = app.get(InsertRolePermissionJob);
    await job.execute();
    await app.close();
  },
};

async function main() {
  const jobName = process.argv[2];

  if (!jobName) {
    console.error('Error: Job name is required');
    console.log('Usage: npm run job <job-name>');
    console.log('Available jobs:');
    Object.keys(jobMap).forEach((name) => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  const job = jobMap[jobName];

  if (!job) {
    console.error(`Error: Job "${jobName}" not found`);
    console.log('Available jobs:');
    Object.keys(jobMap).forEach((name) => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }

  try {
    console.log(`Running job: ${jobName}`);
    await job();
    console.log(`Job "${jobName}" completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`Error running job "${jobName}":`, error);
    process.exit(1);
  }
}

main();
