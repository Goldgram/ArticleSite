<?php
  if (isset($_POST['name']) && isset($_POST['email']) && isset($_POST['message'])) {
    $senderName = strip_tags(mysql_escape_string($_POST['name']));
    $senderEmail = strip_tags(mysql_escape_string($_POST['email']));
    $message = strip_tags(mysql_escape_string($_POST['message']));
    // Change this to your email address you want to form sent to
    $to = "aaa@aaa.com";
    $subject = "Feedback from " . $senderName;
    $headers = "From: " . $senderEmail . " \r\n";

    $result = mail($to, $subject, $message, $headers);
    echo $result ? "success" : "failure";
  } else {
    echo "Access is denied.";
  }
?>
