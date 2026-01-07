import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { InsertRolePermissionJob } from '../src/jobs/insert-role-permission.job';
import { UpdateSuperAdminPermissionJob } from '../src/jobs/update-super-admin-permission.job';

const jobMap: Record<string, (args?: string[]) => Promise<void>> = {
  'insert-role-permission': async () => {
    const app = await NestFactory.createApplicationContext(AppModule);
    const job = app.get(InsertRolePermissionJob);
    await job.execute();
    await app.close();
  },
  'update-super-admin': async (args?: string[]) => {
    if (!args || args.length === 0) {
      console.error('Error: admin_role_id is required');
      console.log('Usage: npm run update-super-admin <admin_role_id>');
      process.exit(1);
    }

    const adminRoleId = args[0];
    const app = await NestFactory.createApplicationContext(AppModule);
    const job = app.get(UpdateSuperAdminPermissionJob);
    await job.execute(adminRoleId);
    await app.close();
  },
};

async function main() {
  const jobName = process.argv[2];
  const jobArgs = process.argv.slice(3);

  if (!jobName) {
    console.error('Error: Job name is required');
    console.log('Usage: npm run job <job-name> [args...]');
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
    await job(jobArgs);
    console.log(`Job "${jobName}" completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`Error running job "${jobName}":`, error);
    process.exit(1);
  }
}

main();
