#!/usr/bin/env python3
"""Minimal Telegram sender (stdlib only): text + media to a forum topic.
   tg.py <topic_id> <text_file> [media ...]
   tg.py --doc <topic_id> <text_file> <file> ...   (send as document, not video/photo)
Reads TELEGRAM_BOT_TOKEN from /opt/data/.env. Chat is the studio supergroup.
"""
import sys, os, json, mimetypes, urllib.request, urllib.parse, uuid

CHAT = -1003852072951
ENV = '/opt/data/.env'


def token():
    for line in open(ENV, encoding='utf-8', errors='ignore'):
        if line.startswith('TELEGRAM_BOT_TOKEN'):
            return line.split('=', 1)[1].strip().strip('"').strip("'")
    raise SystemExit('no token')


def api(method, fields, files=None):
    tok = token()
    url = f'https://api.telegram.org/bot{tok}/{method}'
    if not files:
        data = urllib.parse.urlencode(fields).encode()
        req = urllib.request.Request(url, data=data)
    else:
        boundary = uuid.uuid4().hex
        body = b''
        for k, v in fields.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
        for name, path in files.items():
            fn = os.path.basename(path)
            ctype = mimetypes.guess_type(fn)[0] or 'application/octet-stream'
            body += (f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{fn}"\r\n'
                     f'Content-Type: {ctype}\r\n\r\n').encode()
            body += open(path, 'rb').read() + b'\r\n'
        body += f'--{boundary}--\r\n'.encode()
        req = urllib.request.Request(url, data=body,
                                     headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def main():
    args = sys.argv[1:]
    as_doc = False
    if args and args[0] == '--doc':
        as_doc = True
        args = args[1:]
    topic, textfile, media = args[0], args[1], args[2:]
    text = open(textfile, encoding='utf-8').read()[:4096]
    base = {'chat_id': str(CHAT), 'message_thread_id': topic}
    try:
        m = api('sendMessage', {**base, 'text': text, 'parse_mode': 'Markdown',
                                'disable_web_page_preview': 'true'})
        print('msg', m['result']['message_id'])
    except Exception as e:
        print('text failed:', e)
        m = api('sendMessage', {**base, 'text': text})
        print('msg(plain)', m['result']['message_id'])
    for p in media:
        low = p.lower()
        try:
            if as_doc or low.endswith('.md') or low.endswith('.txt') or low.endswith('.json'):
                r = api('sendDocument', {**base, 'caption': os.path.basename(p)}, {'document': p})
            elif low.endswith(('.mp4', '.mov', '.webm')):
                r = api('sendVideo', {**base, 'caption': os.path.basename(p), 'supports_streaming': 'true',
                                      'width': '1920', 'height': '1080', 'duration': '50'}, {'video': p})
            else:
                r = api('sendPhoto', {**base, 'caption': os.path.basename(p)}, {'photo': p})
            print('sent', p, r['result']['message_id'])
        except Exception as e:
            print('FAILED', p, e)


if __name__ == '__main__':
    main()
