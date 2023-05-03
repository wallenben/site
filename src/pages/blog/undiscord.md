---
layout: '../../layouts/PostLayout.astro'
title: 'Intro to Tampermonkey: Fixing Undiscord'
description: 'Undiscord is a popular Tampermonkey script, that allows for autonomous editing of messages on discord. Unfortunately, the project seems to be largely deprecated, and no longer works autonomously whatsoever. I decided to check this interesting problem out, and see what fixes I could make.'
pubDate: 'May 2 2023'
heroImage: '/discord.webp'
---

Recently, I discovered the tool [undiscord](https://github.com/victornpb/undiscord). Undiscord is a tool that allows you to autonomously edit Discord messages - a valuable asset to general privacy and safety online, particularly when you are using servers that aren't ran by you!

I really liked the idea of Undiscord. The application's process is pretty simple for how it runs:

- Request the first page of messages for the given channel and user ID
- Delete everything on the first page, with variable delete rates for obfuscation
- Request the next page, accounting for a preset delay for obfuscation of API requests.

Seems simple! Unfortunately, there are a few inconsistencies with how it runs, as Discord continually adds features. The first challenge I encountered seemed places directly to contest programs like Undiscord -- the Discord API would return a blank page of messages, given a seemingly random (variable) delay. This is pretty tricky to work around, as Undiscord assumes that a blank page means there is no more messages to delete. Of course, this isn't the case and is something we should account for.

First and foremost, we have to remove the behavior causing the script to terminate contingent on a blank API page. This isn't too hard at all!

```javascript
log.verb(
	`API returned an empty page, retrying in ${(
		this.options.searchDelay / 1000
	).toFixed(2)}s`
);
//log.verb('[End state]', this.state);
//if (isJob) break; // break without stopping if this is part of a job
//this.state.running = false;
```

Next, we have to consider more edgecases: if the program doesn't automatically end, we need to add additional logic so the program knows _when_ to end. If we assume that the program counts every message it deletes (and we can request the total amount of messages to be deleted, when searched), then if these variables equal each-other we can terminate API requests. To do this, we need to add some new state logic -- specifically, we add a new variable `delCount` to our state object:

```javascript
   //potential edge case (?) if there are no more messages to delete -- empty-page error could be looping
        if (this.state.delCount === this.state.grandTotal) {
        //assume rate-limited on first fetch if grandTotal equals zero, fallback on other case
        if (this.state.delCount === this.state.grandTotal && this.state.grandTotal !== 0) {
         log.verb('[End State]', this.state);
          this.state.running = false;
          if (isJob) break;
        }
```

Simple enough! Of course, it isn't this simple to get this script perfectly working, though.

What makes this project so interesting to work on is Undiscord requires thorough consideration of all possible user behavior. It's quite a good refresher on considering various edgecases. Recently, Discord has added a whole new enhancement -- threads -- to their suite. Threads function like a channel-inside-a-channel, and have various changes in comparison to a usual message:

- If the thread is old, it has to be unarchived before any deletion can be done
- There is a rate-limit of unarchiving ~five threads every minute or so
- Creating a thread shows up as a separate message in a user's messages, but cannot be deleted without administrator permissions as it's a system request.

All of these issues are worth considering if we want this script to work. As it stands, this script cannot do anything when threads are hit.
Currently, Undiscord would do the following

- Acquire the thread message ID
- POST a request to delete the thread message ID (which will most likely fail, for lack of administrative rights)
- Skip the thread temporarily and try the rest of the messages. The thread will repopulate in the next GET request, and will try to be deleted again.
  In lieu of trying to avoid DDOSing APIs (and not making Discord upset), we should really change this behavior.

There's a few ways to do this. My initial method was to create a set and store message IDs that fail -- if there's a match, skip the API request.

```javascript
const mapBadMessages = new Set();
//...logic for deleting messages
while (attempt < this.options.maxAttempt) {
	if (!this.state.mapBadMessages.has(message.id)) {
		const result = await this.deleteMessage(message);

		if (result === 'RETRY') {
			attempt++;
			log.verb(
				`Retrying in ${this.options.deleteDelay}ms... (${attempt}/${this.options.maxAttempt})`
			);
			await wait(this.options.deleteDelay);
		} else break;
	} else {
		if (duplicate === true) {
			//skip if more than 1 duplicate message in queue
			this.options.maxId = message.id;
			this.state.duplicate = false;
		} else this.state.duplicate = true;
		log.warn(
			`Skipping message ${message.id} because it is marked as bad -- skipping POST request`
		);
		//still increment
		attempt++;
	}
}
```

Here we have a `while` loop, that manages deleting the messages autonomously. The conditional here is actually another edgecase: we keep track of how many bad messages are buffering, and if it hits the specified `maxAttempt` integer, then we close out of the script. The idea is that eventually there is a possibility so many archived or thread messages will propagate that it will invariably slow down the deletion process. In this case, we terminate the process, so the user can fix the issue.

The rest of the logic is pretty clear: if the API request comes back bad, we mark it as bad, and throw it in the set:

```javascript
if (resp.status === 403 || 400) {
	//skip message in the future, worthless
	this.state.mapBadMessages.add(message.id);
}
```

And then we log that it was skipped, and increment attempts if needed. This takes care of a few issues:

- Stops random API requests to Discord (yay safety)!
- Saves time by removing unnecessary delays in deletion with O(1) lookup times
- Creates a contingency for if threads message exist but all _other_ messages have been removed.

This is a fine solution to the problem, and what I have currently implemented!

However, I believe there is a better approach, and it is one that I am actively exploring in development (after finals, of course)

- If two threads in a row are detected (boolean switch), filter the API request to only get messages from _before_ the dates of the threads.

  This would save a lot of headache, and allow for full autonomous behavior. I think this is something reasonable I could implement soon!

- Change error handling from a set to simply checking the author to allow for deletion

  While this would be nice because we could avoid the set's space complexity, I am not certain it is a perfect solution, as the implication is that a user would always be able to delete their own messages. This may not be the case! Either way, I think having a way to skip bad messages is an absolute necessity, and more error-catching will have to be demoed.

Overall, I think this project is a pretty fun way to continue my interest with Javascript, and open-source contributions. My fork with the aforementioned enhancements can be found [here](https://github.com/wallenben/undiscord)
