codeunit 50100 "Customer Score Manager"
{
    procedure CalculateScore(CustomerNo: Code[20]): Integer
    var
        Customer: Record Customer;
        SalesHeader: Record "Sales Header";
        TotalSales: Decimal;
        Score: Integer;
    begin
        if not Customer.Get(CustomerNo) then
            exit(0);

        // Calculate total sales for the customer
        SalesHeader.SetRange("Sell-to Customer No.", CustomerNo);
        SalesHeader.CalcSums(Amount);
        TotalSales := SalesHeader.Amount;

        // Calculate score based on sales amount
        case true of
            TotalSales >= 100000:
                Score := 100;
            TotalSales >= 50000:
                Score := 75;
            TotalSales >= 25000:
                Score := 50;
            TotalSales >= 10000:
                Score := 25;
            else
                Score := 10;
        end;

        exit(Score);
    end;

    procedure UpdateCustomerRating(var CustomerScore: Record "Customer Score")
    begin
        case CustomerScore.Score of
            90..100:
                CustomerScore.Rating := CustomerScore.Rating::Platinum;
            70..89:
                CustomerScore.Rating := CustomerScore.Rating::Gold;
            50..69:
                CustomerScore.Rating := CustomerScore.Rating::Silver;
            else
                CustomerScore.Rating := CustomerScore.Rating::Bronze;
        end;
    end;

    procedure GetTopCustomers(Count: Integer) CustomerList: List of [Code[20]]
    var
        CustomerScore: Record "Customer Score";
    begin
        CustomerScore.SetCurrentKey(Score);
        CustomerScore.SetAscending(Score, false);
        if CustomerScore.FindSet() then
            repeat
                CustomerList.Add(CustomerScore."Customer No.");
            until (CustomerScore.Next() = 0) or (CustomerList.Count() >= Count);
    end;

    procedure ValidateScore(Score: Integer): Boolean
    begin
        exit((Score >= 0) and (Score <= 100));
    end;

    [EventSubscriber(ObjectType::Table, Database::Customer, 'OnAfterInsertEvent', '', false, false)]
    local procedure OnCustomerInsert(var Rec: Record Customer)
    var
        CustomerScore: Record "Customer Score";
    begin
        if not CustomerScore.Get(Rec."No.") then begin
            CustomerScore.Init();
            CustomerScore."Customer No." := Rec."No.";
            CustomerScore.Score := 10; // Default score for new customers
            UpdateCustomerRating(CustomerScore);
            CustomerScore.Insert();
        end;
    end;
}