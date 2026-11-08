import { parseBody } from '@/domain/content'

export function RichText({ body }: { body: string }) {
  const blocks = parseBody(body)
  return (
    <div className="space-y-5 text-lg leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h2 key={index} className="display-md pt-4">
              {block.text}
            </h2>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )
        }
        return <p key={index}>{block.text}</p>
      })}
    </div>
  )
}
