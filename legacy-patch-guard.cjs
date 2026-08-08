const requiredFlag = '--allow-legacy-patch';

if (!process.argv.includes(requiredFlag)) {
  console.error(
    `Blocked legacy patch script. Review the script first, then rerun with ${requiredFlag} if it is truly needed.`
  );
  process.exit(1);
}
