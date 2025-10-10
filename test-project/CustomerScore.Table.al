table 50100 "Customer Score"
{
    Caption = 'Customer Score';
    DataClassification = CustomerContent;

    fields
    {
        field(1; "Customer No."; Code[20])
        {
            Caption = 'Customer No.';
            TableRelation = Customer."No.";
        }
        field(2; "Score"; Integer)
        {
            Caption = 'Score';
            MinValue = 0;
            MaxValue = 100;
        }
        field(3; "Rating"; Enum "Customer Rating")
        {
            Caption = 'Rating';
        }
        field(4; "Last Updated"; DateTime)
        {
            Caption = 'Last Updated';
            Editable = false;
        }
        field(5; "Total Sales"; Decimal)
        {
            Caption = 'Total Sales';
            FieldClass = FlowField;
            CalcFormula = sum("Sales Line".Amount where("Sell-to Customer No." = field("Customer No.")));
        }
    }

    keys
    {
        key(PK; "Customer No.")
        {
            Clustered = true;
        }
        key(ScoreKey; Score)
        {
        }
    }

    trigger OnInsert()
    begin
        "Last Updated" := CurrentDateTime();
    end;

    trigger OnModify()
    begin
        "Last Updated" := CurrentDateTime();
    end;
}

enum 50100 "Customer Rating"
{
    Extensible = true;

    value(0; Bronze)
    {
        Caption = 'Bronze';
    }
    value(1; Silver)
    {
        Caption = 'Silver';
    }
    value(2; Gold)
    {
        Caption = 'Gold';
    }
    value(3; Platinum)
    {
        Caption = 'Platinum';
    }
}