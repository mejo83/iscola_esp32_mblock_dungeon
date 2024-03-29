<?php
$pass = $_GET['p'];
if ($pass !== 'adminscola')
    die('Accesso Negato');
?>
<!DOCTYPE html>
<html lang="it">
    <head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8" />

        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="">
        <meta name="keywords" content="">
        <!-- Latest compiled and minified CSS -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">

        <!-- Optional theme -->
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">

        <title> Iscola - ViksTech - Admin</title>
    </head>
    <body >
        <div class="hidden" id="tpls">
            <a id="downloadAnchorElem"></a>
            <div id="tpl_free">
                <fieldset data-id="{id}" data-type="free" style="border:1px solid black; margin-top:2px; margin-bottom: 2px;padding-top:2px; padding-bottom: 2px;">
                    <label class="col-xs-12">Domanda: <input class="col-xs-12 question_text" type="text" name="question_{id}" value="{text}"/></label>
                    <label class="col-xs-12">Risposta Valida: <input class="col-xs-12 answer_right" type="text" name="answer_{id}" value="{value}"/></label>
                    <button class="btn btn-danger col-xs-12" onclick="admin.deleteQuestion({id})">Elimina</button>
                </fieldset>
            </div>
            <div id="tpl_static" data-type="static">
                <fieldset data-id="{id}" data-type="static" style="border:1px solid black; margin-top:2px; margin-bottom: 2px;padding-top:2px; padding-bottom: 2px;">
                    <label class="col-xs-12" >Domanda: <input class="col-xs-12 question_text" type="text" name="question_{id}" value="{text}"/></label>
                    <div class="answer">
                        <label class="col-xs-8" >Risposta 0: <input class="col-xs-12 answer_text" type="text" name="answer_0" value="{value_0}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="0" {answer_0_check}/></label>
                    </div>
                    <div class="answer">

                        <label class="col-xs-8" >Risposta 1: <input class="col-xs-12 answer_text" type="text" name="answer_1" value="{value_1}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="1" {answer_1_check}/></label>
                    </div>
                    <div class="answer">
                        <label class="col-xs-8" >Risposta 2: <input class="col-xs-12 answer_text" type="text" name="answer_2" value="{value_2}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="2" {answer_2_check}/></label>
                    </div>
                    <div class="answer">
                        <label class="col-xs-8" >Risposta 3: <input class="col-xs-12 answer_text" type="text" name="answer_3" value="{value_3}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="3" {answer_3_check}/></label>
                    </div>
                    <div class="answer">
                        <label class="col-xs-8" >Risposta 4: <input class="col-xs-12 answer_text" type="text" name="answer_4" value="{value_4}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="4" {answer_4_check}/></label>
                    </div>
                    <div class="answer">
                        <label class="col-xs-8" >Risposta 5: <input class="col-xs-12 answer_text" type="text" name="answer_5" value="{value_5}"/></label>
                        <label class="col-xs-4 text-center" >Valida?: <input class="col-xs-12 answer_right" type="radio" name="anwer_right_{id}" value="5" {answer_5_check} /></label>
                    </div>

                    <button class="btn btn-danger col-xs-12" onclick="admin.deleteQuestion({id})">Elimina</button>
                </fieldset>
            </div>
            <div id="tpl_actions">
                <div class="container" id="actions_btn">
                    <div class="row" style="margin-top: 15px;">
                        <button id="add-free" class="btn btn-info col-xs-3 mt-2" onclick="admin.addNewFreeQuestion()">Nuova Domanda Aperta</button>
                        <button id="add-static" class="btn btn-info col-xs-3 mt-2" onclick="admin.addNewStaticQuestion()">Nuova Domanda Chiusa</button>
                        <button id="save" class="btn btn-success col-xs-3 mt-2" onclick="admin.save()">Salva Domande</button>
                        <button id="download" class="btn btn-warning col-xs-3 mt-2" onclick="admin.download()">Scarica Domande</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="container-fluid">

            <div class="row pattern">
                <section class="features" id="features">
                    <div class="container">
                        <!--<div class="row">
                            <h2>Impostazioni</h2>
                            <p class="section-description">
                                Impostazioni del gioco
                            </p>
                        </div>-->
                        <div class="row">
                            <h2>Domande</h2>
                            <p class="section-description">
                                Domande del gioco
                            </p>
                            <div id="questions">

                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="row pattern-dark">
                <footer class="container footer">

                    <div class="row">
                        <p class="copyright">Copyright &copy; 2019 by ViksTech per Laboratorio Iscola Linea B3.</p>
                    </div>
                </footer>
            </div>
        </div>
        <script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script> 
        <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
        <script src="js/admin.js"></script>
    </body>

</html>