<?php
// Приём заявок с формы. Настройте адрес получателя ниже.
// (по желанию) заполните TG_TOKEN и TG_CHAT — заявки будут приходить и в Telegram.
const MAIL_TO  = 'info@example.ru'; // <-- ЗАМЕНИТЕ на почту автошколы
const MAIL_FROM = 'noreply@xn----7sbaagc0cqfsebjl5agg3t.xn--p1ai';
const TG_TOKEN = '';
const TG_CHAT  = '';

header('Content-Type: application/json; charset=utf-8');
function out($ok, $err = '') { echo json_encode(['ok' => $ok, 'error' => $err], JSON_UNESCAPED_UNICODE); exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 'method');
if (!empty($_POST['website'])) out(true); // антиспам-ловушка

$clean = fn($k, $n = 100) => trim(mb_substr(strip_tags((string)($_POST[$k] ?? '')), 0, $n));
$name = $clean('name'); $surname = $clean('surname'); $format = $clean('format'); $tariff = $clean('tariff');
$phone = preg_replace('/[^\d+]/', '', $clean('phone', 30));
if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) !== 11 || empty($_POST['consent'])) out(false, 'validation');

// не чаще одной заявки в 20 секунд с одного IP
$lock = sys_get_temp_dir() . '/lead_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
if (is_file($lock) && time() - filemtime($lock) < 20) out(false, 'rate');
touch($lock);

$text = "Новая заявка с сайта\nИмя: $name $surname\nТелефон: $phone\nФормат: $format\nТариф: " . ($tariff ?: '—') . "\nСогласие на обработку ПДн: да, " . date('d.m.Y H:i');

$sent = @mail(MAIL_TO, '=?UTF-8?B?' . base64_encode('Заявка с сайта АВАНТА+') . '?=', $text,
    "From: " . MAIL_FROM . "\r\nContent-Type: text/plain; charset=UTF-8");

if (TG_TOKEN && TG_CHAT) {
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query(['chat_id' => TG_CHAT, 'text' => $text]), 'timeout' => 5]]);
    $sent = (@file_get_contents('https://api.telegram.org/bot' . TG_TOKEN . '/sendMessage', false, $ctx) !== false) || $sent;
}
out((bool)$sent, $sent ? '' : 'send');
