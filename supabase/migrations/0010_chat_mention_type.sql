-- Add a notification type for chat @mentions.
alter type notification_type add value if not exists 'chat_mention';
