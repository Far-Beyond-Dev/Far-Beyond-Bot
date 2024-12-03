// Welcome to https://pylon.bot! You can use this editor to write custom code that Pylon will execute!
// Be sure to check out the documentation here: https://pylon.bot/docs/reference/index.html
// For help, join our Discord server: https://discord.gg/6DbcNPz
//
// This is the default script, that shows off some examples. Feel free to obliterate all this and start
// from scratch if you know what you're doing!
//
// **FAQ**:
//  - Q: How do I publish my script
//    A: Just press Ctrl + S, and it's published instantly.
//  - Q: What's that black box at the bottom of the editor do?
//    A: That's the console, you can log stuff to it, to help you develop your scripts, just use `console.log()`.
//       Additionally, if your script throws an error, it'll be logged there in real time!
//  - Q: So, I can basically write any code that I want here?
//    A: Yup! Pylon provides an isolated sandbox that runs your script safely. There are some memory and
//       execution time limits you'll have to be aware of. Check out: https://pylon.bot/docs/dev-limits

// Here's an example of how to use the built in command handler.
const commands = new discord.command.CommandGroup({
  defaultPrefix: '!', // You can customize your default prefix here.
});

commands.raw('stats', async (message) => {
  const username = message.content.split(' ')[1];
  if (!username) {
    return message.reply('Please provide a GitHub username');
  }

  try {
    // Fetch commit history
    const [commitsResp, contributorsResp, contributorStatsResp] =
      await Promise.all([
        fetch(
          `https://api.github.com/repos/Far-Beyond-Dev/Horizon/commits?author=${username}`
        ),
        fetch(
          `https://api.github.com/repos/Far-Beyond-Dev/Horizon/contributors`
        ),
        fetch(
          `https://api.github.com/repos/Far-Beyond-Dev/Horizon/stats/contributors`
        ),
      ]);

    const [commits, contributors, contributorStats] = await Promise.all([
      commitsResp.json(),
      contributorsResp.json(),
      contributorStatsResp.json(),
    ]);

    const userStats = contributors.find(
      (c: any) => c.login.toLowerCase() === username.toLowerCase()
    );

    const userDetailedStats = contributorStats.find(
      (c: any) => c.author.login.toLowerCase() === username.toLowerCase()
    );

    if (!userStats || !Array.isArray(commits)) {
      return message.reply('User not found or has no contributions');
    }

    // Calculate total lines added/removed
    const totalLines = userDetailedStats.weeks.reduce(
      (acc: any, week: any) => ({
        additions: acc.additions + week.a,
        deletions: acc.deletions + week.d,
      }),
      { additions: 0, deletions: 0 }
    );

    // Get last contribution date
    const lastCommit = commits[0]?.commit?.author?.date || 'No commits found';
    const lastContribDate = new Date(lastCommit).toLocaleDateString();

    const embed = new discord.Embed({
      title: `GitHub Stats for ${username}`,
      color: 0x2ecc71,
      description: `Contributions to Far-Beyond-Dev/Horizon`,
      fields: [
        {
          name: 'Total Commits',
          value: commits.length.toString(),
          inline: true,
        },
        {
          name: 'Total Contributions',
          value: userStats.contributions.toString(),
          inline: true,
        },
        {
          name: 'Lines Added',
          value: totalLines.additions.toString(),
          inline: true,
        },
        {
          name: 'Lines Deleted',
          value: totalLines.deletions.toString(),
          inline: true,
        },
        {
          name: 'Total Lines Changed',
          value: (totalLines.additions + totalLines.deletions).toString(),
          inline: true,
        },
        {
          name: 'Last Contribution',
          value: lastContribDate,
          inline: true,
        },
      ],
      thumbnail: {
        url: userStats.avatar_url,
      },
      footer: {
        text: 'Last updated',
      },
      timestamp: new Date().toISOString(),
    });

    await message.reply(embed);
  } catch (error) {
    console.error('GitHub API Error:', error);
    await message.reply('Error fetching GitHub stats. Please try again later.');
  }
});

commands.raw('contribs', async (message) => {
  try {
    const response = await fetch(
      'https://api.github.com/repos/Far-Beyond-Dev/Horizon/stats/contributors'
    );
    const contributors = await response.json();

    if (!Array.isArray(contributors)) {
      return message.reply('Unable to fetch contributors data');
    }

    const sortedContributors = contributors
      .map((c) => ({
        username: c.author.login,
        commits: c.total,
        additions: c.weeks.reduce((sum, week) => sum + week.a, 0),
        deletions: c.weeks.reduce((sum, week) => sum + week.d, 0),
        total: c.weeks.reduce((sum, week) => sum + week.a + week.d, 0),
      }))
      .sort((a, b) => b.total - a.total);

    const embed = new discord.Embed({
      title: 'Horizon Repository Contributors',
      color: 0x2ecc71,
      description: 'Ranked by total lines contributed (additions + deletions)',
      fields: sortedContributors.map((c, index) => ({
        name: `#${index + 1} ${c.username}`,
        value: `Commits: ${c.commits}\nLines Added: ${c.additions}\nLines Deleted: ${c.deletions}\nTotal Lines: ${c.total}`,
        inline: false,
      })),
      footer: {
        text: 'Last updated',
      },
      timestamp: new Date().toISOString(),
    });

    await message.reply(embed);
  } catch (error) {
    console.error('GitHub API Error:', error);
    await message.reply(
      'Error fetching contributors data. Please try again later.'
    );
  }
});
