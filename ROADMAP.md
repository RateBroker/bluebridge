**ROADMAP**

This document explains in detail the list of planned changes of work to be done to `blubridge`

Changes can be discussed in the [GitHub issue tracker](https://github.com/blubridge/blubridge/issues)

**_v0.3.0_**

- Implement LiveQuery & LiveDocument support using socket.io events
- Write unit tests
- Rename project to `blubridge` & migrate repositories to [GitHub organisation](https://github.com/blubridge)

**_v0.4.0_**

- Re-work database engine system

  - Abstract out `query`, `document`, `create`, `save`, `remove`, `statics` & `methods` into blubridge
  - Allow Database engines to be plugged in to support data operations
  - Allow Database engines to fire events, notifying blubridge sockets of data changes -
