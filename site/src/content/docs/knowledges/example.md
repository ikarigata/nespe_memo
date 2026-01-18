---
title: Mermaidテスト
---

import { MermaidScroll } from '../../../components/MermaidScroll';

<MermaidScroll client:visible>

```mermaid
graph TD;
    A[Start] --> B{判定};
    B -- Yes --> C[OK];
    B -- No --> D[NG];
```

</MermaidScroll>
