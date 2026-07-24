# FileUpload 文件上传

用于选择和上传文件。

```js
import { FileUpload } from '@kupola/components/fileupload'

const upload = FileUpload({
  accept: '.pdf,.doc',
  multiple: true,
  onChange: (files) => console.log(files),
})

document.body.appendChild(upload.element)
```

## 常用选项

| 选项 | 说明 |
| --- | --- |
| accept | 接受的文件类型 |
| multiple | 是否多选 |
| maxSize | 最大文件大小 |
| onChange | 文件变化回调 |
| onRemove | 移除回调 |

## 方法

- `clear()`
- `destroy()`
