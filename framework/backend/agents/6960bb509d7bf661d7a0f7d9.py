from agents.base import BaseAgent
class ceditAgent(BaseAgent):
    def run(self, message: str) -> str:
        lines = message.split('\n')
        edited_lines = []
        for line in lines:
            edited_line = ''
            for word in line.split():
                word = word.strip('.,!?"\'')
                if word.isalnum():
                    edited_line += word + ' '
                else:
                    edited_line += ' ' + word + ' '
            edited_lines.append(edited_line.strip())
        return '\n'.join(edited_lines)