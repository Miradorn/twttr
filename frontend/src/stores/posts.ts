import {readable, Readable} from 'svelte/store'

import {Api} from '../Api'

class PostsStore {
  public posts: Readable<string[]>

  private api = new Api()

  constructor() {
    this.posts = readable([''], set => {
      this.api.get('posts').then((allPosts) => set(allPosts))

      const interval = setInterval(() => {
        this.api.get('posts').then((allPosts) => set(allPosts))
      }, 1000);

      return () => clearInterval(interval);
    })
  }
}

export const postsStore = new PostsStore()
