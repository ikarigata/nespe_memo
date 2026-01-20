import os
import re

file_path = 'site/src/content/docs/knowledges/load-balancer.md'
new_path = 'site/src/content/docs/knowledges/load-balancer.mdx'

if os.path.exists(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Add import if missing
    if "import { MermaidBox } from" not in content:
        # Add after frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                parts[2] = "\nimport { MermaidBox } from '../../../../components/MermaidBox';\n" + parts[2]
                content = '---'.join(parts)
        else:
            content = "import { MermaidBox } from '../../../../components/MermaidBox';\n" + content

    # Wrap mermaid blocks
    # Regex to find ```mermaid ... ```
    # Note: dotall is needed
    pattern = re.compile(r'```mermaid(.*?)```', re.DOTALL)

    def replace_func(match):
        mermaid_code = match.group(1)
        return f'<MermaidBox client:visible>\n```mermaid{mermaid_code}```\n</MermaidBox>'

    content = pattern.sub(replace_func, content)

    with open(new_path, 'w') as f:
        f.write(content)

    os.remove(file_path)
    print(f"Converted {file_path} to {new_path}")
else:
    print(f"{file_path} not found")
